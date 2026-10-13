package com.mycompany.englishtutor.module.role.mapper;

import org.mapstruct.Mapper;

import com.mycompany.englishtutor.module.role.api.request.RoleRequest;
import com.mycompany.englishtutor.module.role.api.response.RoleResponse;
import com.mycompany.englishtutor.module.role.domain.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
