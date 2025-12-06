package com.example.service

import com.example.config.DatabaseConfig.dbQuery
import com.example.domain.article.Article
import com.example.domain.article.ArticleListItem
import com.example.domain.article.CreateArticleRequest
import com.example.domain.article.UpdateArticleRequest
import com.example.repository.ArticleRepository
import com.example.util.exceptions.BadRequestException
import com.example.util.exceptions.ForbiddenException
import com.example.util.exceptions.NotFoundException
import kotlinx.serialization.Serializable

import com.example.repository.CommentRepository

@Serializable
data class ArticleListResponse(
    val articles: List<ArticleListItem>,
    val hasNext: Boolean,
    val nextCursor: Long?
)

class ArticleService(
    private val articleRepository: ArticleRepository = ArticleRepository(),
    private val commentRepository: CommentRepository = CommentRepository()
) {

    suspend fun createArticle(request: CreateArticleRequest, authorId: Long): Article {
        if (request.title.isBlank() || request.content.isBlank()) {
            throw BadRequestException("제목과 내용을 입력해주세요.")
        }

        return dbQuery {
            articleRepository.create(
                title = request.title,
                content = request.content,
                authorId = authorId
            )
        }
    }

    suspend fun getArticleById(id: Long, incrementView: Boolean = false): Article {
        return dbQuery {
            articleRepository.findById(id, incrementView)
                ?: throw NotFoundException("게시글을 찾을 수 없습니다.")
        }
    }

    /**
     * 커서 기반 무한 스크롤을 사용한 게시글 목록 조회 (비동기)
     */
    suspend fun getArticles(lastId: Long?, size: Int = 20): ArticleListResponse {
        if (lastId != null && lastId <= 0) {
            throw BadRequestException("lastId는 양수여야 합니다.")
        }

        val pageSize = size.coerceIn(1, 50)
        if (size != pageSize) {
            throw BadRequestException("size 파라미터는 1~50 사이여야 합니다.")
        }

        val articles = dbQuery {
            articleRepository.findAllWithCursor(lastId, pageSize + 1)  // 하나 더 조회해서 다음 페이지 존재 여부 확인
        }

        val hasNext = articles.size > pageSize
        val resultArticles = if (hasNext) articles.dropLast(1) else articles
        val nextCursor = if (hasNext) resultArticles.lastOrNull()?.id else null

        return ArticleListResponse(
            articles = resultArticles,
            hasNext = hasNext,
            nextCursor = nextCursor
        )
    }

    suspend fun updateArticle(id: Long, request: UpdateArticleRequest, userId: Long): Article {
        if (request.title.isBlank() || request.content.isBlank()) {
            throw BadRequestException("제목과 내용을 입력해주세요.")
        }

        val article = getArticleById(id)

        if (article.authorId != userId) {
            throw ForbiddenException("게시글 수정 권한이 없습니다.")
        }

        return dbQuery {
            articleRepository.update(
                id = id,
                title = request.title,
                content = request.content
            )
        }
    }

    suspend fun deleteArticle(id: Long, userId: Long) {
        val article = getArticleById(id)

        if (article.authorId != userId) {
            throw ForbiddenException("게시글 삭제 권한이 없습니다.")
        }

        dbQuery {
            // 댓글 먼저 삭제 (Foreign Key 제약 조건 해결)
            commentRepository.deleteByArticleId(id)
            articleRepository.delete(id)
        }
    }
}
