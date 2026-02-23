package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatRequest;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class AiChatTextSupport {
    private static final Pattern NUMBER_WITH_OPTIONAL_UNIT = Pattern.compile("(\\d+)\\s*(kg|g|gr|gram|grams)?",
            Pattern.CASE_INSENSITIVE);

    private AiChatTextSupport() {
    }

    static String resolveLanguage(AiChatRequest request) {
        String detectedFromMessage = detectLanguageFromMessage(request.getMessage());
        String preferred = request.getPreferredLanguage();
        if (!StringUtils.hasText(preferred)) {
            return detectedFromMessage;
        }
        String normalized = preferred.trim().toLowerCase();
        String preferredLang = "en".equals(normalized) ? "en" : "vi";
        if (!preferredLang.equals(detectedFromMessage) && hasStrongLanguageSignal(request.getMessage())) {
            return detectedFromMessage;
        }
        return preferredLang;
    }

    static String detectLanguageFromMessage(String message) {
        if (!StringUtils.hasText(message))
            return "vi";
        String raw = message.trim().toLowerCase();
        if (raw.matches(".*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ].*")) {
            return "vi";
        }
        String normalized = normalize(raw);
        String[] viHints = { "xin", "chao", "toi", "ban", "khong", "gio hang", "mon" };
        int viScore = 0;
        for (String hint : viHints) {
            if (normalized.contains(hint))
                viScore++;
        }
        String[] enHints = { "hello", "hi", "do you have", "please", "price", "product", "buy", "order", "cart" };
        int enScore = 0;
        for (String hint : enHints) {
            if (normalized.contains(hint))
                enScore++;
        }
        return enScore > viScore ? "en" : "vi";
    }

    static boolean hasStrongLanguageSignal(String message) {
        if (!StringUtils.hasText(message))
            return false;
        String raw = message.toLowerCase();
        if (raw.matches(".*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ].*")) {
            return true;
        }
        String normalized = normalize(raw);
        return normalized.contains("do you have")
                || normalized.contains("best seller")
                || normalized.contains("what is")
                || normalized.contains("xin chao")
                || normalized.contains("co khong");
    }

    static String normalize(String value) {
        if (!StringUtils.hasText(value))
            return "";
        String noAccent = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return noAccent
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    static boolean isAffirmative(String normalized) {
        String[] words = normalized.split(" ");
        if (words.length > 4)
            return false;
        return normalized.equals("co")
                || normalized.equals("dong y")
                || normalized.equals("ok")
                || normalized.equals("yes")
                || normalized.equals("checkout")
                || normalized.contains("dong y")
                || normalized.startsWith("co ")
                || normalized.startsWith("ok ")
                || normalized.startsWith("yes ");
    }

    static boolean isNegative(String normalized) {
        String[] words = normalized.split(" ");
        if (words.length > 4)
            return false;
        return normalized.equals("khong")
                || normalized.equals("thoi")
                || normalized.equals("chua")
                || normalized.equals("no")
                || normalized.contains("de sau")
                || normalized.contains("not now")
                || normalized.contains("later")
                || normalized.contains("khong can")
                || normalized.startsWith("khong ")
                || normalized.startsWith("no ");
    }

    static Integer parseQuantity(String message) {
        Matcher matcher = NUMBER_WITH_OPTIONAL_UNIT.matcher(message.toLowerCase());
        Integer best = null;
        while (matcher.find()) {
            String num = matcher.group(1);
            String unit = matcher.group(2);
            Integer value = parsePositiveInt(num);
            if (value == null)
                continue;
            if (StringUtils.hasText(unit)) {
                continue;
            }
            best = value;
        }
        return best;
    }

    static Integer parsePositiveInt(String value) {
        if (!StringUtils.hasText(value))
            return null;
        try {
            int parsed = Integer.parseInt(value.trim());
            if (parsed <= 0 || parsed > 99)
                return null;
            return parsed;
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
