package com.ecommerce.likefood.user.dto.req;

import com.ecommerce.likefood.common.specification.FilterField;
import com.ecommerce.likefood.common.specification.FilterOperator;
import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSpecRequest {
    @FilterField(operator = FilterOperator.LIKE)
    private String email;

    @FilterField(operator = FilterOperator.LIKE)
    private String phoneNumber;
}
