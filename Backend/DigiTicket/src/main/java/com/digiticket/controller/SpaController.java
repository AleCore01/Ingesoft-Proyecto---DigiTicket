package com.digiticket.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    @RequestMapping(value = "/{path:^(?!api).*$}/**")
    public String forward() { return "forward:/index.html"; }
}
