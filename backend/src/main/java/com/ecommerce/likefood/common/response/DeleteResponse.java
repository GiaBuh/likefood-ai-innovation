package com.ecommerce.likefood.common.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteResponse {
    private String message = "Delete Successfully";
}
