package com.giapho.coffee_shop_backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class để generate BCrypt hash cho password
 * Chạy main method để tạo hash cho password mới
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Password bạn muốn hash
        String password = "AoVErPsFjUvFOwljzI/7bMrJjsTKh7UeIgiT+RiRZWG+0TQVyJvySoWVvCM+Ch0h";
        
        // Generate hash
        String hashedPassword = encoder.encode(password);
        
        System.out.println("============================================");
        System.out.println("Password: " + password);
        System.out.println("============================================");
        System.out.println("BCrypt Hash:");
        System.out.println(hashedPassword);
        System.out.println("============================================");
        System.out.println("\nCopy hash trên và paste vào file V9_sample_data.sql");
        System.out.println("Thay thế tất cả các hash cũ trong cột password của bảng users");
    }
}

