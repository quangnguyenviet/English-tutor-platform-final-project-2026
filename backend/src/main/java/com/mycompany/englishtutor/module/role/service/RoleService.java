package com.mycompany.englishtutor.module.role.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mycompany.englishtutor.module.role.api.request.RoleRequest;
import com.mycompany.englishtutor.module.role.api.response.RoleResponse;
import com.mycompany.englishtutor.module.role.mapper.RoleMapper;
import com.mycompany.englishtutor.module.role.repository.RoleRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;

    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);
        role = roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream().map(roleMapper::toRoleResponse).toList();
    }

    public void delete(String role) {
        roleRepository.deleteById(role);
    }
}
