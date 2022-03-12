package com.api.repository;

import com.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Transactional @Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // USER DATABASE

    User findByEmail(String email);

    void deleteByEmail(String email);

}
