package com.ecommerce.likefood.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TikTokTrendDto {
    private String desc;   
    private String music;  
    private String author; 
    private String views;  
}