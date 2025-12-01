package com.example.route

import com.example.service.SignInRequest
import com.example.service.SignUpRequest
import com.example.service.UserService
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.authRoutes() {
    val userService = UserService()

    route("/api/auth") {
        post("/signup") {
            val request = call.receive<SignUpRequest>()
            val response = userService.signUp(request)
            call.respond(response)
        }

        post("/signin") {
            val request = call.receive<SignInRequest>()
            val response = userService.signIn(request)
            call.respond(response)
        }
    }
}
