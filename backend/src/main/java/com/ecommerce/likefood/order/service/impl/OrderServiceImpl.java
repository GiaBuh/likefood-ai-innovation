package com.ecommerce.likefood.order.service.impl;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.domain.ComboItem;
import com.ecommerce.likefood.ai.repository.ComboCampaignRepository;
import com.ecommerce.likefood.cart.domain.Cart;
import com.ecommerce.likefood.cart.domain.CartItem;
import com.ecommerce.likefood.cart.repository.CartRepository;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.common.specification.GenericSpecification;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.order.domain.OrderItem;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.domain.PaymentMethod;
import com.ecommerce.likefood.order.domain.PaymentStatus;
import com.ecommerce.likefood.order.dto.req.OrderCreateRequest;
import com.ecommerce.likefood.order.dto.req.OrderSpecRequest;
import com.ecommerce.likefood.order.dto.res.OrderCheckoutResponse;
import com.ecommerce.likefood.order.dto.res.OrderResponse;
import com.ecommerce.likefood.order.mapper.OrderMapper;
import com.ecommerce.likefood.order.repository.OrderRepository;
import com.ecommerce.likefood.order.service.OrderInvoiceEmailService;
import com.ecommerce.likefood.order.service.OrderService;
import com.ecommerce.likefood.payment.vnpay.dto.VnpayReturnResponse;
import com.ecommerce.likefood.payment.vnpay.service.VnpayService;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.ecommerce.likefood.voucher.domain.DiscountType;
import com.ecommerce.likefood.voucher.domain.UserVoucher;
import com.ecommerce.likefood.voucher.domain.UserVoucherStatus;
import com.ecommerce.likefood.voucher.domain.Voucher;
import com.ecommerce.likefood.voucher.repository.UserVoucherRepository;
import com.ecommerce.likefood.voucher.repository.VoucherRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final OrderInvoiceEmailService orderInvoiceEmailService;
    private final ProductRepository productRepository;
    private final ComboCampaignRepository comboCampaignRepository;
    private final ObjectMapper objectMapper;
    private final UserVoucherRepository userVoucherRepository;
    private final VoucherRepository voucherRepository;
    private final VnpayService vnpayService;

    @Override
    @Transactional
    public OrderCheckoutResponse createOrderFromMyCart(OrderCreateRequest request, String clientIp) {
        User user = getCurrentUser();
        Cart cart = cartRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new AppException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new AppException("Cart is empty");
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .shippingAddress(request.getShippingAddress())
                .note(request.getNote())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(resolveDefaultPaymentStatus(request.getPaymentMethod()))
                .totalAmount(BigDecimal.ZERO)
                .build();

        if (request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            order.setPaymentRef(generatePaymentRef());
            order.setPaymentGateway("VNPAY");
        }

        List<OrderItem> orderItems = cart.getItems().stream()
                .map(cartItem -> mapCartItemToOrderItem(cartItem, order))
                .toList();

        BigDecimal subtotal = orderItems.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Voucher Calculation Logic
        BigDecimal shopDiscount = BigDecimal.ZERO;
        BigDecimal shippingDiscount = BigDecimal.ZERO;

        if (request.getShopVoucherId() != null && !request.getShopVoucherId().isBlank()) {
            UserVoucher shopVoucher = userVoucherRepository.findByIdAndUserId(request.getShopVoucherId(), user.getId())
                    .orElseThrow(() -> new AppException("Shop voucher not found"));
            shopDiscount = validateAndApplyVoucher(shopVoucher, order, subtotal, true);
        }

        if (request.getShippingVoucherId() != null && !request.getShippingVoucherId().isBlank()) {
            UserVoucher shippingVoucher = userVoucherRepository.findByIdAndUserId(request.getShippingVoucherId(), user.getId())
                    .orElseThrow(() -> new AppException("Shipping voucher not found"));
            shippingDiscount = validateAndApplyVoucher(shippingVoucher, order, subtotal, false);
        }

        BigDecimal finalAmount = subtotal.subtract(shopDiscount).subtract(shippingDiscount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        order.setItems(orderItems);
        order.setTotalAmount(finalAmount);
        if (order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            order.setPaymentAmountVnd(vnpayService.resolvePaymentAmountVnd(order));
        }

        Order savedOrder = orderRepository.save(order);
        deductStockForOrder(savedOrder);
        cart.getItems().clear();
        cartRepository.saveAndFlush(cart);

        OrderResponse orderResponse = orderMapper.toResponse(savedOrder);
        if (savedOrder.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            String paymentUrl = vnpayService.generatePaymentUrl(savedOrder, clientIp);
            return OrderCheckoutResponse.builder()
                    .order(orderResponse)
                    .paymentRequired(true)
                    .paymentProvider("VNPAY")
                    .vnpayPaymentUrl(paymentUrl)
                    .build();
        }

        return OrderCheckoutResponse.builder()
                .order(orderResponse)
                .paymentRequired(false)
                .paymentProvider(null)
                .vnpayPaymentUrl(null)
                .build();
    }

    @Override
    @Transactional
    public String retryVnpayPayment(String orderId, String clientIp) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUser_Id(orderId, user.getId())
                .orElseThrow(() -> new AppException("Order not found"));

        if (order.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new AppException("Order is not using VNPay payment");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new AppException("Order is already paid");
        }

        if (order.getPaymentRef() == null || order.getPaymentRef().isBlank()) {
            order.setPaymentRef(generatePaymentRef());
        }
        if (order.getPaymentAmountVnd() == null || order.getPaymentAmountVnd() <= 0) {
            order.setPaymentAmountVnd(vnpayService.resolvePaymentAmountVnd(order));
        }

        Order savedOrder = orderRepository.save(order);
        return vnpayService.generatePaymentUrl(savedOrder, clientIp);
    }

    @Override
    @Transactional
    public VnpayReturnResponse handleVnpayReturn(Map<String, String> params) {
        String paymentRef = vnpayService.resolvePaymentRef(params);
        if (paymentRef.isBlank()) {
            return VnpayReturnResponse.builder()
                    .validSignature(false)
                    .paid(false)
                    .paymentRef("")
                    .responseCode(params != null ? params.getOrDefault("vnp_ResponseCode", "") : "")
                    .message("Missing VNPay payment reference")
                    .build();
        }

        Order order = orderRepository.findByPaymentRef(paymentRef).orElse(null);
        if (order == null) {
            return VnpayReturnResponse.builder()
                    .validSignature(false)
                    .paid(false)
                    .paymentRef(paymentRef)
                    .responseCode(params != null ? params.getOrDefault("vnp_ResponseCode", "") : "")
                    .message("Order not found")
                    .build();
        }

        boolean validSignature = vnpayService.isReturnSignatureValid(params);
        boolean successResponse = validSignature && vnpayService.isSuccessResponse(params);
        boolean amountMatched = validSignature && vnpayService.isAmountMatched(params, order);
        boolean success = successResponse && amountMatched;

        if (success) {
            if (order.getPaymentStatus() != PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setPaidAt(Instant.now());
                orderRepository.save(order);
            }
        } else if (order.getPaymentStatus() != PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
        }

        String message;
        if (success) {
            message = "Payment successful";
        } else if (!validSignature) {
            message = "Invalid VNPay signature";
        } else if (!successResponse) {
            message = "Payment not completed";
        } else {
            message = "VNPay amount mismatch";
        }

        return VnpayReturnResponse.builder()
                .validSignature(validSignature)
                .paid(success)
                .paymentRef(paymentRef)
                .responseCode(params != null ? params.getOrDefault("vnp_ResponseCode", "") : "")
                .message(message)
                .build();
    }

    private BigDecimal validateAndApplyVoucher(UserVoucher userVoucher, Order order, BigDecimal subtotal, boolean isShopDiscount) {
        if (userVoucher.getStatus() != UserVoucherStatus.SAVED) {
            throw new AppException("Voucher already used or expired");
        }
        Voucher voucher = userVoucher.getVoucher();
        if (subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new AppException("Minimum order value not met for voucher");
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (voucher.getDiscountType() == DiscountType.FIXED_AMOUNT) {
            discount = voucher.getDiscountValue();
        } else {
            discount = subtotal.multiply(voucher.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        }

        if (isShopDiscount) {
            order.setShopVoucher(voucher);
            order.setShopDiscountAmount(discount);
        } else {
            order.setShippingVoucher(voucher);
            order.setShippingDiscountAmount(discount);
        }

        // Mark as used
        userVoucher.setStatus(UserVoucherStatus.USED);
        userVoucher.setUsedAt(Instant.now());
        voucher.setUsageCount(voucher.getUsageCount() + 1);
        userVoucherRepository.save(userVoucher);
        voucherRepository.save(voucher);

        return discount;
    }

    private OrderItem mapCartItemToOrderItem(CartItem cartItem, Order order) {
        if ("COMBO".equals(cartItem.getItemType()) && cartItem.getComboCampaign() != null) {
            ComboCampaign combo = cartItem.getComboCampaign();
            // Extract image key from combo URL
            String imageKey = null;
            if (combo.getImageUrl() != null && combo.getImageUrl().contains("amazonaws.com/")) {
                imageKey = combo.getImageUrl().substring(combo.getImageUrl().indexOf("amazonaws.com/") + 14);
            }
            return OrderItem.builder()
                    .order(order)
                    .itemType("COMBO")
                    .comboCampaignId(combo.getId())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .productName(combo.getComboName())
                    .variantLabel("Combo -" + (combo.getDiscountPercentage() != null ? combo.getDiscountPercentage().intValue() : 0) + "%")
                    .imageKey(imageKey)
                    .build();
        } else {
            // PRODUCT item
            ProductVariant variant = cartItem.getVariant();
            return OrderItem.builder()
                    .order(order)
                    .itemType("PRODUCT")
                    .variant(variant)
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .productName(variant.getProduct().getName())
                    .variantLabel(variant.getWeightValue() + " " + variant.getWeightUnit())
                    .imageKey(variant.getProduct().getThumbnailKey())
                    .build();
        }
    }

    /**
     * Deduct stock for all items in the order.
     * For PRODUCT items: deduct from variant stock.
     * For COMBO items: deduct from each combo item's product variant.
     */
    private void deductStockForOrder(Order order) {
        for (OrderItem item : order.getItems()) {
            if ("COMBO".equals(item.getItemType()) && item.getComboCampaignId() != null) {
                deductComboStock(item);
            } else if (item.getVariant() != null) {
                // Regular product: deduct variant stock
                ProductVariant variant = item.getVariant();
                int newQty = Math.max(0, variant.getQuantity() - item.getQuantity());
                variant.setQuantity(newQty);
                log.info("Stock deduction: {} variant {}, qty {} -> {}",
                        item.getProductName(), variant.getSku(),
                        variant.getQuantity() + item.getQuantity(), newQty);
            }
        }
    }

    /**
     * Deduct stock from the original products in a combo using ComboItem relations.
     */
    private void deductComboStock(OrderItem orderItem) {
        try {
            ComboCampaign combo = comboCampaignRepository.findById(orderItem.getComboCampaignId())
                    .orElse(null);
            if (combo == null || combo.getComboItems() == null) return;

            for (ComboItem comboItem : combo.getComboItems()) {
                ProductVariant targetVariant = comboItem.getVariant();
                if (targetVariant == null) {
                    // Use cheapest variant as fallback
                    targetVariant = comboItem.getProduct().getVariants().stream()
                            .filter(v -> v.getPrice() != null && v.getPrice().compareTo(BigDecimal.ZERO) > 0)
                            .min((a, b) -> a.getPrice().compareTo(b.getPrice()))
                            .orElse(null);
                }
                if (targetVariant != null) {
                    int deductQty = orderItem.getQuantity() * comboItem.getQuantity();
                    int newQty = Math.max(0, targetVariant.getQuantity() - deductQty);
                    log.info("Combo stock deduction: {} variant {} ({}), qty {} -> {}",
                            comboItem.getProduct().getName(), targetVariant.getSku(),
                            targetVariant.getWeightValue() + targetVariant.getWeightUnit(),
                            targetVariant.getQuantity(), newQty);
                    targetVariant.setQuantity(newQty);
                }
            }
        } catch (Exception e) {
            log.error("Failed to deduct combo stock for order item: {}", orderItem.getProductName(), e);
        }
    }

    @Override
    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        return orderRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Override
    public PaginationResponse getAllOrders(OrderSpecRequest orderSpecRequest, Pageable pageable) {
        Specification<Order> spec = GenericSpecification.filter(orderSpecRequest);
        Page<Order> page = orderRepository.findAll(spec, pageable);

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .total(page.getTotalElements())
                .build();

        List<OrderResponse> result = page.getContent().stream()
                .map(orderMapper::toResponse)
                .toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(String orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException("Order not found"));

        OrderStatus currentStatus = order.getStatus();
        if (status == currentStatus) {
            return orderMapper.toResponse(order);
        }

        if (!isAdminStatusTransitionAllowed(currentStatus, status)) {
            throw new AppException("Invalid status transition from %s to %s".formatted(currentStatus, status));
        }

        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        if (status == OrderStatus.COMPLETED) {
            try {
                orderInvoiceEmailService.sendInvoiceEmail(savedOrder);
            } catch (Exception e) {
                // Email is best-effort; do not fail the status update
                System.err.println("Failed to send invoice email for order " + orderId + ": " + e.getMessage());
            }
        }
        return orderMapper.toResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse cancelMyOrder(String orderId) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUser_Id(orderId, user.getId())
                .orElseThrow(() -> new AppException("Order not found"));

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == OrderStatus.CANCELED) {
            return orderMapper.toResponse(order);
        }

        if (currentStatus == OrderStatus.SHIPPED || currentStatus == OrderStatus.COMPLETED) {
            throw new AppException("Order cannot be canceled at current status");
        }

        order.setStatus(OrderStatus.CANCELED);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    private PaymentStatus resolveDefaultPaymentStatus(PaymentMethod paymentMethod) {
        if (paymentMethod == PaymentMethod.BANK_TRANSFER) {
            return PaymentStatus.FAILED;
        }
        return PaymentStatus.PENDING;
    }

    private String generatePaymentRef() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private User getCurrentUser() {
        String currentEmail = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("Unauthenticated"));
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException("User not found"));
    }

    private boolean isAdminStatusTransitionAllowed(OrderStatus currentStatus, OrderStatus nextStatus) {
        if (currentStatus == OrderStatus.CANCELED || currentStatus == OrderStatus.COMPLETED) {
            return false;
        }
        return switch (currentStatus) {
            case PENDING -> nextStatus == OrderStatus.CONFIRMED || nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELED;
            case CONFIRMED -> nextStatus == OrderStatus.SHIPPED || nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELED;
            case SHIPPED -> nextStatus == OrderStatus.COMPLETED;
            default -> false;
        };
    }
}
