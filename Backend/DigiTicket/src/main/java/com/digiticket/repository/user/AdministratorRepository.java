package com.digiticket.repository.user;

import com.digiticket.domain.user.Administrator;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministratorRepository extends JpaRepository<Administrator, Integer> {
}