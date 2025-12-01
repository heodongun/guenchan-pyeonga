package com.example.repository

import com.example.domain.comment.Comment
import com.example.domain.comment.Comments
import com.example.domain.user.Users
import com.example.util.exceptions.NotFoundException
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.time.LocalDateTime

class CommentRepository {

    private fun ResultRow.toComment() = Comment(
        id = this[Comments.id].value,
        content = this[Comments.content],
        authorId = this[Comments.authorId].value,
        authorNickname = this[Users.nickname],
        articleId = this[Comments.articleId].value,
        parentId = this[Comments.parentId],
        path = this[Comments.path],
        depth = this[Comments.depth],
        isDeleted = this[Comments.isDeleted],
        createdAt = this[Comments.createdAt],
        updatedAt = this[Comments.updatedAt]
    )

    suspend fun create(
        content: String,
        authorId: Long,
        articleId: Long,
        parentId: Long?
    ): Comment {
        // 부모 댓글 정보 가져오기
        val parent = parentId?.let { findById(it) }

        val path = if (parent != null) {
            "${parent.path}/${parent.id}"
        } else {
            ""
        }

        val depth = parent?.depth?.plus(1) ?: 0

        val id = Comments.insert {
            it[Comments.content] = content
            it[Comments.authorId] = authorId
            it[Comments.articleId] = articleId
            it[Comments.parentId] = parentId
            it[Comments.path] = path
            it[Comments.depth] = depth
        }[Comments.id].value

        return findById(id) ?: throw NotFoundException("생성된 댓글을 찾을 수 없습니다.")
    }

    suspend fun findById(id: Long): Comment? {
        return (Comments innerJoin Users)
            .select { Comments.id eq id }
            .mapNotNull { it.toComment() }
            .singleOrNull()
    }

    suspend fun findByArticleId(articleId: Long): List<Comment> {
        return (Comments innerJoin Users)
            .select { Comments.articleId eq articleId }
            .orderBy(Comments.path to SortOrder.ASC, Comments.id to SortOrder.ASC)
            .map { it.toComment() }
    }

    /**
     * 특정 댓글의 자식 댓글들을 조회
     */
    suspend fun findChildren(parentId: Long): List<Comment> {
        val parent = findById(parentId) ?: return emptyList()
        val pathPrefix = if (parent.path.isEmpty()) "${parent.id}" else "${parent.path}/${parent.id}"

        return (Comments innerJoin Users)
            .select { Comments.path like "$pathPrefix%" }
            .map { it.toComment() }
    }

    /**
     * 댓글을 논리적 삭제 (Soft Delete)
     */
    suspend fun softDelete(id: Long) {
        Comments.update({ Comments.id eq id }) {
            it[Comments.isDeleted] = true
            it[Comments.content] = "삭제된 댓글입니다."
            it[Comments.updatedAt] = LocalDateTime.now()
        }
    }

    /**
     * 댓글을 물리적 삭제 (Hard Delete)
     */
    suspend fun hardDelete(id: Long) {
        Comments.deleteWhere { Comments.id eq id }
    }

    /**
     * 자식 댓글 개수 조회
     */
    suspend fun countChildren(id: Long): Long {
        val comment = findById(id) ?: return 0L
        val pathPrefix = if (comment.path.isEmpty()) "${comment.id}" else "${comment.path}/${comment.id}"

        return Comments.select { Comments.path like "$pathPrefix%" }.count()
    }

    /**
     * 삭제되지 않은 자식 댓글 개수 조회
     */
    suspend fun countNonDeletedChildren(id: Long): Long {
        val comment = findById(id) ?: return 0L
        val pathPrefix = if (comment.path.isEmpty()) "${comment.id}" else "${comment.path}/${comment.id}"

        return Comments.select {
            (Comments.path like "$pathPrefix%") and (Comments.isDeleted eq false)
        }.count()
    }

    suspend fun existsById(id: Long): Boolean {
        return Comments.select { Comments.id eq id }.count() > 0
    }
}
