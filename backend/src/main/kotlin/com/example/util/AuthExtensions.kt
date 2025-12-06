package com.example.util

import com.example.util.exceptions.UnauthorizedException
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun ApplicationCall.userIdOrThrow(): Long {
    val principal = principal<JWTPrincipal>() ?: throw UnauthorizedException("인증이 필요합니다.")
    val userId = principal.payload.getClaim("userId").asLong()
    return userId ?: throw UnauthorizedException("토큰에 사용자 정보가 없습니다.")
}
