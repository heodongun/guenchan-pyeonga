package com.example.util.exceptions

sealed class BoardException(message: String) : Exception(message)

// 404 Not Found
class NotFoundException(message: String = "리소스를 찾을 수 없습니다.") : BoardException(message)

// 400 Bad Request
class BadRequestException(message: String = "잘못된 요청입니다.") : BoardException(message)

// 401 Unauthorized
class UnauthorizedException(message: String = "인증이 필요합니다.") : BoardException(message)

// 403 Forbidden
class ForbiddenException(message: String = "권한이 없습니다.") : BoardException(message)

// 409 Conflict
class ConflictException(message: String = "이미 존재하는 리소스입니다.") : BoardException(message)
