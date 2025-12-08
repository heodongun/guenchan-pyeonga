package com.example.route

import com.example.domain.reservation.CreateReservationRequest
import com.example.domain.reservation.UpdateReservationStatusRequest
import com.example.service.ReservationService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.reservationRoutes() {
    val reservationService = ReservationService()

    route("/api/reservations") {
        post {
            val request = call.receive<CreateReservationRequest>()
            val userId = call.request.headers["X-User-Id"]?.toLongOrNull()

            val result = reservationService.createReservation(userId, request)
            if (result.isSuccess) {
                call.respond(HttpStatusCode.Created, result.getOrThrow())
            } else {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to result.exceptionOrNull()?.message)
                )
            }
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
                return@get
            }

            val reservation = reservationService.getReservationById(id)
            if (reservation != null) {
                call.respond(reservation)
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Reservation not found"))
            }
        }

        get("/event/{eventId}") {
            val eventId = call.parameters["eventId"]?.toLongOrNull()
            if (eventId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid event ID"))
                return@get
            }

            val reservations = reservationService.getReservationsByEventId(eventId)
            call.respond(reservations)
        }

        get("/user/{userId}") {
            val userId = call.parameters["userId"]?.toLongOrNull()
            if (userId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid user ID"))
                return@get
            }

            val reservations = reservationService.getReservationsByUserId(userId)
            call.respond(reservations)
        }

        get("/email/{email}") {
            val email = call.parameters["email"]
            if (email == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid email"))
                return@get
            }

            val reservations = reservationService.getReservationsByEmail(email)
            call.respond(reservations)
        }

        patch("/{id}/status") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
                return@patch
            }

            val request = call.receive<UpdateReservationStatusRequest>()
            val success = reservationService.updateReservationStatus(id, request.status)

            if (success) {
                call.respond(HttpStatusCode.OK, mapOf("success" to true))
            } else {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid status or reservation not found"))
            }
        }

        delete("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
                return@delete
            }

            val success = reservationService.deleteReservation(id)
            if (success) {
                call.respond(HttpStatusCode.OK, mapOf("success" to true))
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Reservation not found"))
            }
        }
    }
}
