package com.ecommerce.likefood.order.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import com.ecommerce.likefood.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    private String receiverName;

    private String receiverPhone;

    private String shippingAddress;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    @Column(unique = true)
    private String paymentRef;

    private String paymentGateway;

    @Column
    private Long paymentAmountVnd;

    private Instant paidAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_voucher_id")
    private com.ecommerce.likefood.voucher.domain.Voucher shopVoucher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_voucher_id")
    private com.ecommerce.likefood.voucher.domain.Voucher shippingVoucher;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal shopDiscountAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal shippingDiscountAmount = BigDecimal.ZERO;
}
