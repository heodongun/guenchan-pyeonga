package com.example.route

import com.example.domain.comment.CreateCommentRequest
import com.example.service.CommentService
import com.example.util.userIdOrThrow
import com.example.util.exceptions.BadRequestException
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.commentRoutes() {
    val commentService = CommentService()

    route("/api/comments") {
        // 게시글의 댓글 목록 조회 (인증 불필요)
        get("/article/{articleId}") {
            val articleId = call.parameters["articleId"]?.toLongOrNull()
                ?: throw BadRequestException("잘못된 게시글 ID입니다.")

            val comments = commentService.getCommentsByArticleId(articleId)
            call.respond(comments)
        }

        // 인증이 필요한 엔드포인트
        authenticate("auth-jwt") {
            // 댓글 작성
            post {
                val userId = call.userIdOrThrow()

                val request = call.receive<CreateCommentRequest>()
                val comment = commentService.createComment(request, userId)

                call.respond(HttpStatusCode.Created, comment)
            }

            // 댓글 삭제
            delete("/{id}") {
                val userId = call.userIdOrThrow()

                val id = call.parameters["id"]?.toLongOrNull()
                    ?: throw BadRequestException("잘못된 댓글 ID입니다.")

                commentService.deleteComment(id, userId)

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
