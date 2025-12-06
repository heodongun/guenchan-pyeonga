package com.example.config

import com.example.domain.article.CreateArticleRequest
import com.example.domain.article.UpdateArticleRequest
import com.example.domain.comment.CreateCommentRequest
import com.example.service.SignInRequest
import com.example.service.SignUpRequest
import io.ktor.server.application.*
import io.ktor.server.plugins.requestvalidation.*

private val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")

fun Application.configureRequestValidation() {
    install(RequestValidation) {
        validate<SignUpRequest> { request ->
            when {
                !emailRegex.matches(request.email) ->
                    ValidationResult.Invalid("이메일 형식이 올바르지 않습니다.")
                request.password.length < 8 ->
                    ValidationResult.Invalid("비밀번호는 8자 이상이어야 합니다.")
                request.nickname.length !in 2..20 ->
                    ValidationResult.Invalid("닉네임은 2~20자 사이여야 합니다.")
                else -> ValidationResult.Valid
            }
        }

        validate<SignInRequest> { request ->
            when {
                request.email.isBlank() || request.password.isBlank() ->
                    ValidationResult.Invalid("이메일과 비밀번호를 모두 입력해주세요.")
                else -> ValidationResult.Valid
            }
        }

        validate<CreateArticleRequest> { request ->
            when {
                request.title.length !in 1..120 ->
                    ValidationResult.Invalid("제목은 1~120자 사이여야 합니다.")
                request.content.length !in 1..5000 ->
                    ValidationResult.Invalid("본문은 1~5000자 사이여야 합니다.")
                else -> ValidationResult.Valid
            }
        }

        validate<UpdateArticleRequest> { request ->
            when {
                request.title.length !in 1..120 ->
                    ValidationResult.Invalid("제목은 1~120자 사이여야 합니다.")
                request.content.length !in 1..5000 ->
                    ValidationResult.Invalid("본문은 1~5000자 사이여야 합니다.")
                else -> ValidationResult.Valid
            }
        }

        validate<CreateCommentRequest> { request ->
            when {
                request.content.length !in 1..800 ->
                    ValidationResult.Invalid("댓글은 1~800자 사이여야 합니다.")
                else -> ValidationResult.Valid
            }
        }
    }
}
