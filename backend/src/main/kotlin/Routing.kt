package com.example

import com.example.route.articleRoutes
import com.example.route.authRoutes
import com.example.route.commentRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Board API Server is running!")
        }

        get("/health") {
            call.respondText("OK")
        }

        // 라우트 등록
        authRoutes()
        articleRoutes()
        commentRoutes()
    }
}
