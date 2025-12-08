package com.example.route

import com.example.service.PlaceService
import com.example.util.exceptions.BadRequestException
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.placeRoutes() {
    val placeService = PlaceService()

    route("/api/spots") {
        get {
            val size = call.request.queryParameters["size"]?.toIntOrNull()
            size?.let {
                if (it <= 0) throw BadRequestException("size는 1 이상이어야 합니다.")
            }

            val result = placeService.getPlaces(size ?: 9)
            call.respond(result)
        }
    }
}
