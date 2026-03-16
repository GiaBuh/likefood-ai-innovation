package com.ecommerce.likefood.storage.enums;

public enum StorageObjectType {
    PRODUCT("products"),
    AVATAR("avatars"),
    REVIEW("reviews");

    private final String folder;

    StorageObjectType(String folder) {
        this.folder = folder;
    }

    public String getFolder() {
        return folder;
    }
}
