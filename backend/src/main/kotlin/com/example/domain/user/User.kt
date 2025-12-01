package com.example.domain.user

import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Users : LongIdTable("users") {
    val email = varchar("email", 255).uniqueIndex()
    val password = varchar("password", 255)
    val nickname = varchar("nickname", 100)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)
}

data class User(
    val id: Long,
    val email: String,
    val password: String,
    val nickname: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class UserResponse(
    val id: Long,
    val email: String,
    val nickname: String,
    val createdAt: LocalDateTime
)

fun User.toResponse() = UserResponse(
    id = id,
    email = email,
    nickname = nickname,
    createdAt = createdAt
)
