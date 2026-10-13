package com.mycompany.englishtutor.module.user.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.mycompany.englishtutor.module.user.api.request.UserCreationRequest;
import com.mycompany.englishtutor.module.user.api.request.UserUpdateRequest;
import com.mycompany.englishtutor.module.user.api.response.UserResponse;
import com.mycompany.englishtutor.module.user.domain.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
