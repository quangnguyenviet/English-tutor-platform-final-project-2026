package com.mycompany.englishtutor.module.role.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.role.domain.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {}
