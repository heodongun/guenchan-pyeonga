package com.example.route

import com.example.domain.comment.CreateCommentRequest
import com.example.service.CommentService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.commentRoutes() {
    val commentService = CommentService()

    route("/api/comments") {
        // 게시글의 댓글 목록 조회 (인증 불필요)
        get("/article/{articleId}") {
            val articleId = call.parameters["articleId"]?.toLongOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid article ID")

            val comments = commentService.getCommentsByArticleId(articleId)
            call.respond(comments)
        }

        // 인증이 필요한 엔드포인트
        authenticate("auth-jwt") {
            // 댓글 작성
            post {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)

                val request = call.receive<CreateCommentRequest>()
                val comment = commentService.createComment(request, userId)

                call.respond(HttpStatusCode.Created, comment)
            }

            // 댓글 삭제
            delete("/{id}") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@delete call.respond(HttpStatusCode.Unauthorized)

                val id = call.parameters["id"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, "Invalid comment ID")

                commentService.deleteComment(id, userId)

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
