package com.example.config

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import java.util.*

object JWTConfig {
    private val secret = System.getenv("JWT_SECRET") ?: "my-secret-key-change-in-production"
    private val issuer = System.getenv("JWT_ISSUER") ?: "board-api"
    private val audience = System.getenv("JWT_AUDIENCE") ?: "board-users"
    private val validityInMs = 3600000 * 24 // 24 hours

    private val algorithm = Algorithm.HMAC256(secret)

    fun generateToken(userId: Long, email: String): String {
        return JWT.create()
            .withAudience(audience)
            .withIssuer(issuer)
            .withClaim("userId", userId)
            .withClaim("email", email)
            .withExpiresAt(Date(System.currentTimeMillis() + validityInMs))
            .sign(algorithm)
    }

    fun Application.configureJWT() {
        install(Authentication) {
            jwt("auth-jwt") {
                realm = "Board API"
                verifier(
                    JWT.require(algorithm)
                        .withAudience(audience)
                        .withIssuer(issuer)
                        .build()
                )
                validate { credential ->
                    if (credential.payload.audience.contains(audience)) {
                        JWTPrincipal(credential.payload)
                    } else {
                        null
                    }
                }
            }
        }
    }
}
