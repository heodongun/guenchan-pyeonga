package com.example.route

import com.example.service.EventService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Serializable
data class CreateEventRequest(
    val title: String,
    val placeId: Long?,
    val placeName: String,
    val location: String,
    val startAt: String,
    val endAt: String?,
    val category: String,
    val capacity: Int,
    val spotInfo: String,
    val description: String
)

@Serializable
data class UpdateEventRequest(
    val title: String?,
    val placeName: String?,
    val location: String?,
    val startAt: String?,
    val endAt: String?,
    val category: String?,
    val capacity: Int?,
    val spotInfo: String?,
    val description: String?
)

fun Route.eventRoutes() {
    val eventService = EventService()

    route("/api/events") {
        get("/weekly") {
            val result = eventService.getWeeklyEvents()
            call.respond(result)
        }

        get {
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 50
            val result = eventService.getAllEvents(limit)
            call.respond(result)
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
                return@get
            }

            val event = eventService.getEventById(id)
            if (event != null) {
                call.respond(event)
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event not found"))
            }
        }

        post {
            val request = call.receive<CreateEventRequest>()
            val event = eventService.createEvent(
                title = request.title,
                placeId = request.placeId,
                placeName = request.placeName,
                location = request.location,
                startAt = LocalDateTime.parse(request.startAt),
                endAt = request.endAt?.let { LocalDateTime.parse(it) },
                category = request.category,
                capacity = request.capacity,
                spotInfo = request.spotInfo,
                description = request.description
            )
            call.respond(HttpStatusCode.Created, event)
        }

        put("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
                return@put
            }

            val request = call.receive<UpdateEventRequest>()
            val success = eventService.updateEvent(
                id = id,
                title = request.title,
                placeName = request.placeName,
                location = request.location,
                startAt = request.startAt?.let { LocalDateTime.parse(it) },
                endAt = request.endAt?.let { LocalDateTime.parse(it) },
                category = request.category,
                capacity = request.capacity,
                spotInfo = request.spotInfo,
                description = request.description
            )

            if (success) {
                call.respond(HttpStatusCode.OK, mapOf("success" to true))
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event not found"))
            }
        }

        delete("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
                return@delete
            }

            val success = eventService.deleteEvent(id)
            if (success) {
                call.respond(HttpStatusCode.OK, mapOf("success" to true))
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event not found"))
            }
        }

        get("/calendar/month/{year}/{month}") {
            val year = call.parameters["year"]?.toIntOrNull()
            val month = call.parameters["month"]?.toIntOrNull()

            if (year == null || month == null || month !in 1..12) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid year or month"))
                return@get
            }

            val events = eventService.getEventsByMonth(year, month)
            call.respond(events)
        }

        get("/calendar/day/{year}/{month}/{day}") {
            val year = call.parameters["year"]?.toIntOrNull()
            val month = call.parameters["month"]?.toIntOrNull()
            val day = call.parameters["day"]?.toIntOrNull()

            if (year == null || month == null || day == null ||
                month !in 1..12 || day !in 1..31) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid date"))
                return@get
            }

            val events = eventService.getEventsByDay(year, month, day)
            call.respond(events)
        }
    }
}
