package com.example.repository

import com.example.domain.event.Event
import com.example.domain.event.Events
import com.example.domain.place.Places
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import java.time.LocalDateTime

class EventRepository {

    private fun ResultRow.toEvent() = Event(
        id = this[Events.id].value,
        title = this[Events.title],
        placeId = this[Events.placeId]?.value,
        placeName = this[Events.placeName],
        location = this[Events.location],
        startAt = this[Events.startAt],
        endAt = this[Events.endAt],
        category = this[Events.category],
        capacity = this[Events.capacity],
        spotInfo = this[Events.spotInfo],
        description = this[Events.description],
        createdAt = this[Events.createdAt]
    )

    suspend fun create(
        title: String,
        placeId: Long?,
        placeName: String,
        location: String,
        startAt: LocalDateTime,
        endAt: LocalDateTime?,
        category: String,
        capacity: Int,
        spotInfo: String,
        description: String?
    ): Event {
        val id = Events.insert {
            it[Events.title] = title
            it[Events.placeId] = placeId?.let { pid -> EntityID(pid, Places) }
            it[Events.placeName] = placeName
            it[Events.location] = location
            it[Events.startAt] = startAt
            it[Events.endAt] = endAt
            it[Events.category] = category
            it[Events.capacity] = capacity
            it[Events.spotInfo] = spotInfo
            it[Events.description] = description?.ifBlank { null }
        }[Events.id].value

        return findById(id)!!
    }

    suspend fun findById(id: Long): Event? {
        return Events.select { Events.id eq id }
            .map { it.toEvent() }
            .singleOrNull()
    }

    suspend fun findAll(limit: Int = 50): List<Event> {
        return Events.selectAll()
            .orderBy(Events.startAt, SortOrder.DESC)
            .limit(limit)
            .map { it.toEvent() }
    }

    suspend fun update(
        id: Long,
        title: String?,
        placeName: String?,
        location: String?,
        startAt: LocalDateTime?,
        endAt: LocalDateTime?,
        category: String?,
        capacity: Int?,
        spotInfo: String?,
        description: String?
    ): Boolean {
        val updated = Events.update({ Events.id eq id }) {
            title?.let { t -> it[Events.title] = t }
            placeName?.let { pn -> it[Events.placeName] = pn }
            location?.let { l -> it[Events.location] = l }
            startAt?.let { sa -> it[Events.startAt] = sa }
            endAt?.let { ea -> it[Events.endAt] = ea }
            category?.let { c -> it[Events.category] = c }
            capacity?.let { cap -> it[Events.capacity] = cap }
            spotInfo?.let { si -> it[Events.spotInfo] = si }
            description?.let { d -> it[Events.description] = d.ifBlank { null } }
        }
        return updated > 0
    }

    suspend fun delete(id: Long): Boolean {
        val deleted = Events.deleteWhere { Events.id eq id }
        return deleted > 0
    }

    suspend fun findUpcomingWithin(days: Long, limit: Int = 20): List<Event> {
        val now = LocalDateTime.now()
        val until = now.plusDays(days)

        return Events.select {
            (Events.startAt greaterEq now) and (Events.startAt lessEq until)
        }
            .orderBy(Events.startAt, SortOrder.ASC)
            .limit(limit)
            .map { it.toEvent() }
    }

    suspend fun countUpcoming(days: Long): Long {
        val now = LocalDateTime.now()
        val until = now.plusDays(days)
        return Events.select { (Events.startAt greaterEq now) and (Events.startAt lessEq until) }.count()
    }

    suspend fun findByDateRange(from: LocalDateTime, to: LocalDateTime): List<Event> {
        return Events.select {
            (Events.startAt greaterEq from) and (Events.startAt lessEq to)
        }
            .orderBy(Events.startAt, SortOrder.ASC)
            .map { it.toEvent() }
    }

    suspend fun findByMonth(year: Int, month: Int): List<Event> {
        val start = LocalDateTime.of(year, month, 1, 0, 0, 0)
        val end = start.plusMonths(1).minusSeconds(1)
        return findByDateRange(start, end)
    }

    suspend fun findByDay(year: Int, month: Int, day: Int): List<Event> {
        val start = LocalDateTime.of(year, month, day, 0, 0, 0)
        val end = start.plusDays(1).minusSeconds(1)
        return findByDateRange(start, end)
    }
}
