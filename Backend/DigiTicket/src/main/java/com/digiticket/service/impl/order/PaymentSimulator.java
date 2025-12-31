package com.digiticket.service.impl.order;

import com.digiticket.domain.order.PaymentStatus;
import com.digiticket.dto.order.PaymentResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PaymentSimulator {

    public PaymentResult authorize(BigDecimal amount,String token,int points, String method){
        boolean approved = !token.contains("FAIL");
        String authCode= approved ? UUID.randomUUID().toString().substring(0,8):null;
        String message = approved ?(method.equals("WALLET_SIM")? "Pago con billetera aprobado":"Pago con tarjeta aprobado"):
                "Pago rechazado";

        return new PaymentResult(
                approved ? PaymentStatus.APPROVED:PaymentStatus.DECLINED,
                authCode,
                message
        );
    }
}
