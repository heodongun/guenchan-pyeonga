package com.example.repository

import com.example.domain.article.Article
import com.example.domain.article.ArticleListItem
import com.example.domain.article.Articles
import com.example.domain.comment.Comments
import com.example.domain.user.Users
import com.example.util.exceptions.NotFoundException
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import java.time.LocalDateTime

class ArticleRepository {

    private fun ResultRow.toArticle() = Article(
        id = this[Articles.id].value,
        title = this[Articles.title],
        content = this[Articles.content],
        authorId = this[Articles.authorId].value,
        authorNickname = this[Users.nickname],
        viewCount = this[Articles.viewCount],
        createdAt = this[Articles.createdAt],
        updatedAt = this[Articles.updatedAt]
    )

    suspend fun create(title: String, content: String, authorId: Long): Article {
        val id = Articles.insert {
            it[Articles.title] = title
            it[Articles.content] = content
            it[Articles.authorId] = authorId
        }[Articles.id].value

        return findById(id) ?: throw NotFoundException("생성된 게시글을 찾을 수 없습니다.")
    }

    suspend fun findById(id: Long, incrementView: Boolean = false): Article? {
        if (incrementView) {
            Articles.update({ Articles.id eq id }) {
                it[viewCount] = viewCount + 1
            }
        }

        return (Articles innerJoin Users)
            .select { Articles.id eq id }
            .mapNotNull { it.toArticle() }
            .singleOrNull()
    }

    /**
     * 커서 기반 무한 스크롤을 위한 게시글 목록 조회 (비동기)
     * @param lastId 마지막으로 조회한 게시글 ID (null이면 첫 페이지)
     * @param size 페이지 크기
     * @return 게시글 목록
     */
    suspend fun findAllWithCursor(lastId: Long?, size: Int = 20): List<ArticleListItem> {
        val query = (Articles innerJoin Users)
            .leftJoin(Comments, { Articles.id }, { Comments.articleId })
            .slice(
                Articles.id,
                Articles.title,
                Users.nickname,
                Articles.viewCount,
                Articles.createdAt,
                Comments.id.count()
            )
            .selectAll()
            .apply {
                if (lastId != null) {
                    andWhere { Articles.id less lastId }
                }
            }
            .groupBy(Articles.id)
            .orderBy(Articles.id, SortOrder.DESC)
            .limit(size)

        return query.map {
            ArticleListItem(
                id = it[Articles.id].value,
                title = it[Articles.title],
                authorNickname = it[Users.nickname],
                viewCount = it[Articles.viewCount],
                commentCount = it[Comments.id.count()].toInt(),
                createdAt = it[Articles.createdAt]
            )
        }
    }

    suspend fun update(id: Long, title: String, content: String): Article {
        Articles.update({ Articles.id eq id }) {
            it[Articles.title] = title
            it[Articles.content] = content
            it[Articles.updatedAt] = LocalDateTime.now()
        }

        return findById(id) ?: throw NotFoundException("게시글을 찾을 수 없습니다.")
    }

    suspend fun delete(id: Long) {
        Articles.deleteWhere { Articles.id eq id }
    }

    suspend fun existsById(id: Long): Boolean {
        return Articles.select { Articles.id eq id }.count() > 0
    }
}
