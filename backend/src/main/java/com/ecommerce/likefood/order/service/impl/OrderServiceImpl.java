package com.ecommerce.likefood.order.service.impl;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.repository.ComboCampaignRepository;
import com.ecommerce.likefood.cart.domain.Cart;
import com.ecommerce.likefood.cart.repository.CartRepository;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.common.specification.GenericSpecification;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.order.domain.OrderItem;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.domain.PaymentStatus;
import com.ecommerce.likefood.order.dto.req.OrderCreateRequest;
import com.ecommerce.likefood.order.dto.req.OrderSpecRequest;
import com.ecommerce.likefood.order.dto.res.OrderResponse;
import com.ecommerce.likefood.order.mapper.OrderMapper;
import com.ecommerce.likefood.order.repository.OrderRepository;
import com.ecommerce.likefood.order.service.OrderInvoiceEmailService;
import com.ecommerce.likefood.order.service.OrderService;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

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

    @Override
    @Transactional
    public OrderResponse createOrderFromMyCart(OrderCreateRequest request) {
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
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        List<OrderItem> orderItems = cart.getItems().stream()
                .map(cartItem -> OrderItem.builder()
                        .order(order)
                        .variant(cartItem.getVariant())
                        .quantity(cartItem.getQuantity())
                        .price(cartItem.getPrice())
                        .productName(cartItem.getVariant().getProduct().getName())
                        .variantLabel(
                                cartItem.getVariant().getWeightValue() + " " + cartItem.getVariant().getWeightUnit()
                        )
                        .imageKey(cartItem.getVariant().getProduct().getThumbnailKey())
                        .build())
                .toList();

        BigDecimal totalAmount = orderItems.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        deductComboStock(savedOrder);
        cart.getItems().clear();
        cartRepository.saveAndFlush(cart);

        return orderMapper.toResponse(savedOrder);
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
            orderInvoiceEmailService.sendInvoiceEmail(savedOrder);
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

    private User getCurrentUser() {
        String currentEmail = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("Unauthenticated"));
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException("User not found"));
    }

    /**
     * When a combo order is completed, deduct stock from each original product in the combo.
     */
    private void deductComboStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product orderedProduct = item.getVariant().getProduct();
            // Check if this product belongs to "AI Combos" category
            if (orderedProduct.getCategory() != null 
                && "AI Combos".equals(orderedProduct.getCategory().getName())) {
                
                // Find the combo campaign by matching product name
                String comboName = orderedProduct.getName();
                List<ComboCampaign> combos = comboCampaignRepository
                    .findByStatusOrderByCreatedAtDesc("PUBLISHED");
                
                for (ComboCampaign combo : combos) {
                    if (comboName.equals(combo.getComboName()) && combo.getItems() != null) {
                        try {
                            List<String> itemNames = objectMapper.readValue(
                                combo.getItems(),
                                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
                            );
                            // Find original products and deduct stock on cheapest variant only
                            List<Product> originalProducts = productRepository.findByNameIn(itemNames);
                            for (Product origProduct : originalProducts) {
                                // Find the cheapest variant (same logic as combo pricing)
                                ProductVariant cheapestVariant = origProduct.getVariants().stream()
                                    .filter(v -> v.getPrice() != null && v.getPrice().compareTo(BigDecimal.ZERO) > 0)
                                    .min((a, b) -> a.getPrice().compareTo(b.getPrice()))
                                    .orElse(null);
                                
                                if (cheapestVariant != null) {
                                    int deductQty = item.getQuantity();
                                    int newQty = Math.max(0, cheapestVariant.getQuantity() - deductQty);
                                    log.info("Combo stock deduction: {} variant {} ({}), qty {} -> {}",
                                        origProduct.getName(), cheapestVariant.getSku(),
                                        cheapestVariant.getWeightValue() + cheapestVariant.getWeightUnit(),
                                        cheapestVariant.getQuantity(), newQty);
                                    cheapestVariant.setQuantity(newQty);
                                }
                            }
                            productRepository.saveAll(originalProducts);
                        } catch (Exception e) {
                            log.error("Failed to deduct combo stock for: {}", comboName, e);
                        }
                        break; // Found matching combo, stop searching
                    }
                }
            }
        }
    }

    private boolean isAdminStatusTransitionAllowed(OrderStatus currentStatus, OrderStatus nextStatus) {
        if (currentStatus == OrderStatus.CANCELED || currentStatus == OrderStatus.COMPLETED) {
            return false;
        }
        return (currentStatus == OrderStatus.PENDING && (nextStatus == OrderStatus.CONFIRMED || nextStatus == OrderStatus.COMPLETED))
                || (currentStatus == OrderStatus.CONFIRMED && (nextStatus == OrderStatus.SHIPPED || nextStatus == OrderStatus.COMPLETED))
                || (currentStatus == OrderStatus.SHIPPED && nextStatus == OrderStatus.COMPLETED);
    }

}
