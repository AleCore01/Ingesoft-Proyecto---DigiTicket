package com.digiticket.repository.user;

import com.digiticket.domain.user.Client;
import com.digiticket.domain.user.UserStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Integer> {
    Optional<Client> findByUserId(Integer userId);
    @Query("""
           select c from Client c
           where c.user.status = :status
             and (
                    lower(c.user.firstName) like lower(concat('%', :name, '%'))
                 or lower(c.user.lastName)  like lower(concat('%', :name, '%'))
             )
           """)
    List<Client> searchByNameAndStatus(@Param("name") String name,
                                       @Param("status") UserStatus status);
}
