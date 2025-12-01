package com.example.domain.article

import com.example.domain.user.Users
import com.example.util.LocalDateTimeSerializer
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Articles : LongIdTable("articles") {
    val title = varchar("title", 255)
    val content = text("content")
    val authorId = reference("author_id", Users)
    val viewCount = integer("view_count").default(0)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)
}

@Serializable
data class Article(
    val id: Long,
    val title: String,
    val content: String,
    val authorId: Long,
    val authorNickname: String,
    val viewCount: Int,
    @Serializable(with = LocalDateTimeSerializer::class)
    val createdAt: LocalDateTime,
    @Serializable(with = LocalDateTimeSerializer::class)
    val updatedAt: LocalDateTime
)

@Serializable
data class ArticleListItem(
    val id: Long,
    val title: String,
    val authorNickname: String,
    val viewCount: Int,
    val commentCount: Int,
    @Serializable(with = LocalDateTimeSerializer::class)
    val createdAt: LocalDateTime
)

@Serializable
data class CreateArticleRequest(
    val title: String,
    val content: String
)

@Serializable
data class UpdateArticleRequest(
    val title: String,
    val content: String
)
