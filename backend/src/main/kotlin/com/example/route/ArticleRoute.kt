package com.example.route

import com.example.domain.article.CreateArticleRequest
import com.example.domain.article.UpdateArticleRequest
import com.example.service.ArticleService
import com.example.util.userIdOrThrow
import com.example.util.exceptions.BadRequestException
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.articleRoutes() {
    val articleService = ArticleService()

    route("/api/articles") {
        // 게시글 목록 조회 (인증 불필요)
        get {
            val lastId = call.request.queryParameters["lastId"]?.toLongOrNull()
            val size = call.request.queryParameters["size"]?.toIntOrNull() ?: 20

            val response = articleService.getArticles(lastId, size)
            call.respond(response)
        }

        // 게시글 상세 조회 (인증 불필요)
        get("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: throw BadRequestException("잘못된 게시글 ID입니다.")

            val article = articleService.getArticleById(id, incrementView = true)
            call.respond(article)
        }

        // 인증이 필요한 엔드포인트
        authenticate("auth-jwt") {
            // 게시글 작성
            post {
                val userId = call.userIdOrThrow()

                val request = call.receive<CreateArticleRequest>()
                val article = articleService.createArticle(request, userId)

                call.respond(HttpStatusCode.Created, article)
            }

            // 게시글 수정
            put("/{id}") {
                val userId = call.userIdOrThrow()

                val id = call.parameters["id"]?.toLongOrNull()
                    ?: throw BadRequestException("잘못된 게시글 ID입니다.")

                val request = call.receive<UpdateArticleRequest>()
                val article = articleService.updateArticle(id, request, userId)

                call.respond(article)
            }

            // 게시글 삭제
            delete("/{id}") {
                val userId = call.userIdOrThrow()

                val id = call.parameters["id"]?.toLongOrNull()
                    ?: throw BadRequestException("잘못된 게시글 ID입니다.")

                articleService.deleteArticle(id, userId)

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
