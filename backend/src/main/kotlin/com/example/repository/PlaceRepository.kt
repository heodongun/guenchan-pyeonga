package com.example.repository

import com.example.domain.place.Place
import com.example.domain.place.Places
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll

class PlaceRepository {

    private fun ResultRow.toPlace() = Place(
        id = this[Places.id].value,
        name = this[Places.name],
        tag = this[Places.tag],
        meta = this[Places.meta],
        location = this[Places.location],
        description = this[Places.description],
        createdAt = this[Places.createdAt]
    )

    suspend fun create(
        name: String,
        tag: String,
        meta: String,
        location: String,
        description: String
    ): Place {
        val id = Places.insert {
            it[Places.name] = name
            it[Places.tag] = tag
            it[Places.meta] = meta
            it[Places.location] = location
            it[Places.description] = description
        }[Places.id].value

        return findAll(1).first { it.id == id }
    }

    suspend fun findAll(limit: Int = 10): List<Place> {
        return Places.selectAll()
            .orderBy(Places.createdAt, SortOrder.DESC)
            .limit(limit)
            .map { it.toPlace() }
    }

    suspend fun count(): Long = Places.selectAll().count()
}
