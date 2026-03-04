package com.ecommerce.likefood.order.service.impl;

import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.order.domain.OrderItem;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.domain.PaymentMethod;
import com.ecommerce.likefood.order.service.OrderInvoiceEmailService;
import com.ecommerce.likefood.storage.service.StorageService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderInvoiceEmailServiceImpl implements OrderInvoiceEmailService {

    private static final String BRAND_NAME = "Like Food";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.systemDefault());

    private final JavaMailSender mailSender;
    private final StorageService storageService;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendInvoiceEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null ||
                order.getUser().getEmail().isBlank()) {
            log.warn("Cannot send invoice email: order or user email is missing");
            return;
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            log.debug("Order {} is not COMPLETED, skipping invoice email", order.getId());
            return;
        }

        String toEmail = order.getUser().getEmail();
        String subject = "[" + BRAND_NAME + "] Hóa đơn đơn hàng #" + order.getId();
        String htmlContent = buildInvoiceHtml(order);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail != null && !fromEmail.isBlank() ? fromEmail : "noreply@likefood.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Invoice email sent to {} for order {}", toEmail, order.getId());
        } catch (MessagingException e) {
            log.error("Failed to send invoice email for order {}: {}", order.getId(), e.getMessage());
        }
    }

    private String buildInvoiceHtml(Order order) {
        StringBuilder itemsHtml = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            BigDecimal lineTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            String imageUrl = getImageUrl(item.getImageKey());
            String imgTag = imageUrl != null && !imageUrl.isBlank()
                    ? "<img src=\"" + escapeHtml(imageUrl) + "\" alt=\"" + escapeHtml(item.getProductName())
                            + "\" width=\"64\" height=\"64\" style=\"object-fit:cover;border-radius:8px;\"/>"
                    : "<div style=\"width:64px;height:64px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;font-size:10px;\">No img</div>";

            itemsHtml.append("""
                    <tr>
                        <td style="padding:12px;border-bottom:1px solid #eee;vertical-align:middle;">
                            %s
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #eee;">
                            <strong>%s</strong><br/>
                            <span style="color:#666;font-size:13px;">%s</span>
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">%d</td>
                        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">%s</td>
                        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;"><strong>%s</strong></td>
                    </tr>
                    """.formatted(
                    imgTag,
                    escapeHtml(item.getProductName()),
                    escapeHtml(item.getVariantLabel()),
                    item.getQuantity(),
                    formatMoney(item.getPrice()),
                    formatMoney(lineTotal)));
        }

        String createdAt = order.getCreatedAt() != null
                ? DATE_FORMATTER.format(order.getCreatedAt())
                : "-";
        String paymentMethod = order.getPaymentMethod() != null
                ? formatPaymentMethod(order.getPaymentMethod())
                : "-";

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background:linear-gradient(135deg,#22c55e 0%%,#16a34a 100%%);padding:28px 32px;text-align:center;">
                                            <img src="https://likefood-prod.s3.ap-southeast-1.amazonaws.com/logo/logo_likefood.png" alt="LikeFood" width="80" height="80" style="display:block;margin:0 auto 12px;border-radius:12px;" />
                                            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">%s</h1>
                                            <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Hóa đơn đơn hàng</p>
                                        </td>
                                    </tr>
                                    <!-- Order info -->
                                    <tr>
                                        <td style="padding:24px 32px 20px;">
                                            <table width="100%%" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;">
                                                <tr>
                                                    <td width="50%%" style="padding:4px 0;">
                                                        <span style="color:#6b7280;font-size:12px;">Mã đơn hàng</span><br/>
                                                        <strong style="color:#111;">#%s</strong>
                                                    </td>
                                                    <td width="50%%" style="padding:4px 0;">
                                                        <span style="color:#6b7280;font-size:12px;">Ngày đặt</span><br/>
                                                        <strong style="color:#111;">%s</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td width="50%%" style="padding:4px 0;padding-top:12px;">
                                                        <span style="color:#6b7280;font-size:12px;">Hình thức thanh toán</span><br/>
                                                        <strong style="color:#111;">%s</strong>
                                                    </td>
                                                    <td width="50%%" style="padding:4px 0;padding-top:12px;">
                                                        <span style="color:#6b7280;font-size:12px;">Giao đến</span><br/>
                                                        <strong style="color:#111;">%s</strong>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!-- Items table -->
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
                                                <thead>
                                                    <tr style="background:#f9fafb;">
                                                        <th style="padding:12px;text-align:left;border-bottom:1px solid #eee;width:80px;">Ảnh</th>
                                                        <th style="padding:12px;text-align:left;border-bottom:1px solid #eee;">Sản phẩm</th>
                                                        <th style="padding:12px;text-align:center;border-bottom:1px solid #eee;width:60px;">SL</th>
                                                        <th style="padding:12px;text-align:right;border-bottom:1px solid #eee;width:80px;">Đơn giá</th>
                                                        <th style="padding:12px;text-align:right;border-bottom:1px solid #eee;width:100px;">Thành tiền</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    %s
                                                </tbody>
                                            </table>
                                            <!-- Total -->
                                            <div style="margin-top:20px;text-align:right;padding:16px;background:#f9fafb;border-radius:8px;">
                                                <span style="font-size:18px;font-weight:700;color:#f97316;">Tổng tiền: %s</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding:20px 32px 28px;text-align:center;background:#f9fafb;border-top:1px solid #eee;">
                                            <p style="margin:0;color:#6b7280;font-size:13px;">Cảm ơn bạn đã đặt hàng tại %s!</p>
                                            <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">© Like Food. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(
                        BRAND_NAME,
                        escapeHtml(order.getId()),
                        escapeHtml(createdAt),
                        escapeHtml(paymentMethod),
                        escapeHtml(order.getShippingAddress() != null ? order.getShippingAddress() : "-"),
                        itemsHtml,
                        formatMoney(order.getTotalAmount()),
                        BRAND_NAME);
    }

    private String getImageUrl(String imageKey) {
        if (imageKey == null || imageKey.isBlank()) {
            return null;
        }
        try {
            return storageService.getPublicImageUrl(imageKey);
        } catch (Exception e) {
            log.debug("Could not resolve image URL for key {}: {}", imageKey, e.getMessage());
            return null;
        }
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null)
            return "0 $";
        return String.format(Locale.GERMAN, "%,.0f $", amount.doubleValue());
    }

    private String formatPaymentMethod(PaymentMethod method) {
        return switch (method) {
            case COD -> "Thanh toán khi nhận hàng (COD)";
            case BANK_TRANSFER -> "Chuyển khoản ngân hàng";
            case E_WALLET -> "Ví điện tử";
            default -> method.name();
        };
    }

    private String escapeHtml(String s) {
        if (s == null)
            return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
