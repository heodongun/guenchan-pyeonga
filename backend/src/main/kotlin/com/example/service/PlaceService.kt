package com.example.service

import com.example.config.DatabaseConfig.dbQuery
import com.example.domain.place.Place
import com.example.repository.PlaceRepository

class PlaceService(
    private val placeRepository: PlaceRepository = PlaceRepository()
) {
    suspend fun getPlaces(limit: Int = 10): List<Place> {
        val size = limit.coerceIn(1, 50)
        return dbQuery { placeRepository.findAll(size) }
    }
}
