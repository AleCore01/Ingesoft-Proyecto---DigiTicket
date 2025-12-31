package com.digiticket.repository.order;

import com.digiticket.domain.order.Payment;
import org.springframework.data.jpa.repository.JpaRepository;


public interface PaymentRepository extends JpaRepository<Payment,Integer> {

}
