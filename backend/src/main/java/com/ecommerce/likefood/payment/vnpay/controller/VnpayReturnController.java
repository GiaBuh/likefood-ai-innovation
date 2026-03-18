package com.ecommerce.likefood.payment.vnpay.controller;

import com.ecommerce.likefood.order.service.OrderService;
import com.ecommerce.likefood.payment.vnpay.dto.VnpayReturnResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/payments/vnpay")
@RequiredArgsConstructor
public class VnpayReturnController {

    private final OrderService orderService;

    @GetMapping("/return")
    public ResponseEntity<VnpayReturnResponse> handleReturn(@RequestParam Map<String, String> params) {
        VnpayReturnResponse response = orderService.handleVnpayReturn(params);
        return ResponseEntity.ok(response);
    }
}
