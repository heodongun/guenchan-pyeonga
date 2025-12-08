package com.example.service

import com.example.config.DatabaseConfig.dbQuery
import com.example.domain.reservation.Reservation
import com.example.domain.reservation.CreateReservationRequest
import com.example.repository.ReservationRepository
import com.example.repository.EventRepository

class ReservationService(
    private val reservationRepository: ReservationRepository = ReservationRepository(),
    private val eventRepository: EventRepository = EventRepository()
) {
    suspend fun createReservation(userId: Long?, request: CreateReservationRequest): Result<Reservation> {
        return dbQuery {
            val event = eventRepository.findById(request.eventId)
                ?: return@dbQuery Result.failure(Exception("Event not found"))

            val currentParticipants = reservationRepository.countByEventId(request.eventId)
            if (currentParticipants >= event.capacity) {
                return@dbQuery Result.failure(Exception("Event is full"))
            }

            val reservation = reservationRepository.create(
                eventId = request.eventId,
                userId = userId,
                participantName = request.participantName,
                participantEmail = request.participantEmail,
                participantPhone = request.participantPhone,
                notes = request.notes
            )

            Result.success(reservation)
        }
    }

    suspend fun getReservationById(id: Long): Reservation? {
        return dbQuery { reservationRepository.findById(id) }
    }

    suspend fun getReservationsByEventId(eventId: Long): List<Reservation> {
        return dbQuery { reservationRepository.findByEventId(eventId) }
    }

    suspend fun getReservationsByUserId(userId: Long): List<Reservation> {
        return dbQuery { reservationRepository.findByUserId(userId) }
    }

    suspend fun getReservationsByEmail(email: String): List<Reservation> {
        return dbQuery { reservationRepository.findByEmail(email) }
    }

    suspend fun updateReservationStatus(id: Long, status: String): Boolean {
        return dbQuery {
            if (status !in listOf("confirmed", "cancelled")) {
                return@dbQuery false
            }
            reservationRepository.updateStatus(id, status)
        }
    }

    suspend fun cancelReservation(id: Long): Boolean {
        return dbQuery {
            reservationRepository.updateStatus(id, "cancelled")
        }
    }

    suspend fun deleteReservation(id: Long): Boolean {
        return dbQuery { reservationRepository.delete(id) }
    }
}
