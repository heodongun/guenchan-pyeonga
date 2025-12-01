package com.example.repository

import com.example.domain.user.User
import com.example.domain.user.UserResponse
import com.example.domain.user.Users
import com.example.domain.user.toResponse
import com.example.util.exceptions.ConflictException
import com.example.util.exceptions.NotFoundException
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.selectAll

class UserRepository {
    private fun resultRowToUser(row: ResultRow) = User(
        id = row[Users.id].value,
        email = row[Users.email],
        password = row[Users.password],
        nickname = row[Users.nickname],
        createdAt = row[Users.createdAt],
        updatedAt = row[Users.updatedAt]
    )

    suspend fun create(email: String, password: String, nickname: String): User {
        // 이메일 중복 체크
        if (existsByEmail(email)) {
            throw ConflictException("이미 사용 중인 이메일입니다.")
        }

        val id = Users.insert {
            it[Users.email] = email
            it[Users.password] = password
            it[Users.nickname] = nickname
        }[Users.id].value

        return findById(id) ?: throw NotFoundException("생성된 사용자를 찾을 수 없습니다.")
    }

    suspend fun findById(id: Long): User? {
        return Users.select { Users.id eq id }
            .mapNotNull { resultRowToUser(it) }
            .singleOrNull()
    }

    suspend fun findByEmail(email: String): User? {
        return Users.select { Users.email eq email }
            .mapNotNull { resultRowToUser(it) }
            .singleOrNull()
    }

    suspend fun existsByEmail(email: String): Boolean {
        return Users.select { Users.email eq email }
            .count() > 0
    }

    suspend fun findAll(): List<UserResponse> {
        return Users.selectAll()
            .map { resultRowToUser(it).toResponse() }
    }
}
