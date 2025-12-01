package com.example.service

import com.example.config.DatabaseConfig.dbQuery
import com.example.config.JWTConfig
import com.example.domain.user.UserResponse
import com.example.domain.user.toResponse
import com.example.repository.UserRepository
import com.example.util.PasswordEncoder
import com.example.util.exceptions.BadRequestException
import com.example.util.exceptions.UnauthorizedException
import kotlinx.serialization.Serializable

@Serializable
data class SignUpRequest(
    val email: String,
    val password: String,
    val nickname: String
)

@Serializable
data class SignInRequest(
    val email: String,
    val password: String
)

@Serializable
data class AuthResponse(
    val user: UserResponse,
    val token: String
)

class UserService(private val userRepository: UserRepository = UserRepository()) {

    suspend fun signUp(request: SignUpRequest): AuthResponse {
        if (request.email.isBlank() || request.password.isBlank() || request.nickname.isBlank()) {
            throw BadRequestException("모든 필드를 입력해주세요.")
        }

        val hashedPassword = PasswordEncoder.encode(request.password)

        val user = dbQuery {
            userRepository.create(
                email = request.email,
                password = hashedPassword,
                nickname = request.nickname
            )
        }

        val token = JWTConfig.generateToken(user.id, user.email)

        return AuthResponse(
            user = user.toResponse(),
            token = token
        )
    }

    suspend fun signIn(request: SignInRequest): AuthResponse {
        val user = dbQuery { userRepository.findByEmail(request.email) }
            ?: throw UnauthorizedException("이메일 또는 비밀번호가 일치하지 않습니다.")

        if (!PasswordEncoder.matches(request.password, user.password)) {
            throw UnauthorizedException("이메일 또는 비밀번호가 일치하지 않습니다.")
        }

        val token = JWTConfig.generateToken(user.id, user.email)

        return AuthResponse(
            user = user.toResponse(),
            token = token
        )
    }

    suspend fun getUserById(userId: Long): UserResponse {
        val user = dbQuery { userRepository.findById(userId) }
            ?: throw com.example.util.exceptions.NotFoundException("사용자를 찾을 수 없습니다.")

        return user.toResponse()
    }
}
