package com.ecommerce.likefood.payment.sepay.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayIpnRequest {
    @JsonProperty("notification_type")
    private String notificationType;

    @JsonProperty("order_invoice_number")
    private String orderInvoiceNumber;

    private OrderData order;

    private TransactionData transaction;

    public String resolveOrderInvoiceNumber() {
        if (orderInvoiceNumber != null && !orderInvoiceNumber.isBlank()) {
            return orderInvoiceNumber;
        }
        return order != null ? order.getOrderInvoiceNumber() : null;
    }

    public String resolveTransactionStatus() {
        return transaction != null ? transaction.getTransactionStatus() : null;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrderData {
        @JsonProperty("order_invoice_number")
        private String orderInvoiceNumber;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TransactionData {
        @JsonProperty("transaction_status")
        private String transactionStatus;
    }
}
