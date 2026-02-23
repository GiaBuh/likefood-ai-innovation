package com.ecommerce.likefood.storage.enums;

public enum StorageObjectType {
    PRODUCT("products"),
    AVATAR("avatars");

    private final String folder;

    StorageObjectType(String folder) {
        this.folder = folder;
    }

    public String getFolder() {
        return folder;
    }
}
