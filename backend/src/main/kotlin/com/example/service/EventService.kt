package com.example.service

import com.example.config.DatabaseConfig.dbQuery
import com.example.domain.event.Event
import com.example.repository.EventRepository
import com.example.repository.ReservationRepository
import java.time.LocalDateTime

class EventService(
    private val eventRepository: EventRepository = EventRepository(),
    private val reservationRepository: ReservationRepository = ReservationRepository()
) {
    suspend fun getWeeklyEvents(limit: Int = 20): List<Event> {
        val size = limit.coerceIn(1, 50)
        val events = dbQuery { eventRepository.findUpcomingWithin(days = 7, limit = size) }
        return events.map { enrichWithParticipants(it) }
    }

    suspend fun getEventById(id: Long): Event? {
        val event = dbQuery { eventRepository.findById(id) } ?: return null
        return enrichWithParticipants(event)
    }

    suspend fun getAllEvents(limit: Int = 50): List<Event> {
        val events = dbQuery { eventRepository.findAll(limit) }
        return events.map { enrichWithParticipants(it) }
    }

    suspend fun createEvent(
        title: String,
        placeId: Long?,
        placeName: String,
        location: String,
        startAt: LocalDateTime,
        endAt: LocalDateTime?,
        category: String,
        capacity: Int,
        spotInfo: String,
        description: String
    ): Event {
        return dbQuery {
            eventRepository.create(
                title, placeId, placeName, location,
                startAt, endAt, category, capacity, spotInfo, description
            )
        }
    }

    suspend fun updateEvent(
        id: Long,
        title: String? = null,
        placeName: String? = null,
        location: String? = null,
        startAt: LocalDateTime? = null,
        endAt: LocalDateTime? = null,
        category: String? = null,
        capacity: Int? = null,
        spotInfo: String? = null,
        description: String? = null
    ): Boolean {
        return dbQuery {
            eventRepository.update(
                id, title, placeName, location,
                startAt, endAt, category, capacity, spotInfo, description
            )
        }
    }

    suspend fun deleteEvent(id: Long): Boolean {
        return dbQuery { eventRepository.delete(id) }
    }

    suspend fun getEventsByDateRange(from: LocalDateTime, to: LocalDateTime): List<Event> {
        val events = dbQuery { eventRepository.findByDateRange(from, to) }
        return events.map { enrichWithParticipants(it) }
    }

    suspend fun getEventsByMonth(year: Int, month: Int): List<Event> {
        val events = dbQuery { eventRepository.findByMonth(year, month) }
        return events.map { enrichWithParticipants(it) }
    }

    suspend fun getEventsByDay(year: Int, month: Int, day: Int): List<Event> {
        val events = dbQuery { eventRepository.findByDay(year, month, day) }
        return events.map { enrichWithParticipants(it) }
    }

    private suspend fun enrichWithParticipants(event: Event): Event {
        val count = dbQuery { reservationRepository.countByEventId(event.id) }
        return event.copy(currentParticipants = count.toInt())
    }
}
