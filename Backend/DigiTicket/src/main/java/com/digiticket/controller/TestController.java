package com.digiticket.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        return "✅ DigiTicket is running and connected to the database!";
    }
}