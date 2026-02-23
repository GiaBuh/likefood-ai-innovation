package com.ecommerce.likefood.ai.dto.res;

import com.ecommerce.likefood.ai.dto.req.AiChatContext;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatResponse {
    private String reply;
    private boolean refusal;
    private boolean shouldOfferAddToCart;
    private String language;
    private AiChatContext nextContext;
    private AiCartInstruction cartInstruction;

    @Builder.Default
    private List<String> matchedProductIds = new ArrayList<>();

    @Builder.Default
    private List<AiChatAction> actions = new ArrayList<>();
}
