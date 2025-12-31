package com.digiticket.util;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

//@SpringBootApplication
public class GeneratePassword {
    //public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Admin123!";
        String encodedPassword = encoder.encode(rawPassword);
        //System.out.println(encodedPassword);
    //}
}