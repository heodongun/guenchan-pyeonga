package com.example.domain.comment

import com.example.domain.article.Articles
import com.example.domain.user.Users
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Comments : LongIdTable("comments") {
    val content = text("content")
    val authorId = reference("author_id", Users)
    val articleId = reference("article_id", Articles)
    val parentId = long("parent_id").nullable()
    val path = varchar("path", 1000).default("")  // 계층 구조를 위한 경로 (예: "1/5/12")
    val depth = integer("depth").default(0)
    val isDeleted = bool("is_deleted").default(false)  // Soft delete를 위한 플래그
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)
}

data class Comment(
    val id: Long,
    val content: String,
    val authorId: Long,
    val authorNickname: String,
    val articleId: Long,
    val parentId: Long?,
    val path: String,
    val depth: Int,
    val isDeleted: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val children: List<Comment> = emptyList()
)

data class CommentResponse(
    val id: Long,
    val content: String,
    val authorId: Long,
    val authorNickname: String,
    val parentId: Long?,
    val depth: Int,
    val isDeleted: Boolean,
    val createdAt: LocalDateTime,
    val children: List<CommentResponse> = emptyList()
)

data class CreateCommentRequest(
    val content: String,
    val articleId: Long,
    val parentId: Long? = null
)

fun Comment.toResponse(): CommentResponse = CommentResponse(
    id = id,
    content = if (isDeleted) "삭제된 댓글입니다." else content,
    authorId = authorId,
    authorNickname = if (isDeleted) "알 수 없음" else authorNickname,
    parentId = parentId,
    depth = depth,
    isDeleted = isDeleted,
    createdAt = createdAt,
    children = children.map { it.toResponse() }
)
