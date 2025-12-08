package com.example.repository

import com.example.domain.reservation.Reservation
import com.example.domain.reservation.Reservations
import com.example.domain.event.Events
import com.example.domain.user.Users
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.time.LocalDateTime

class ReservationRepository {

    private fun ResultRow.toReservation() = Reservation(
        id = this[Reservations.id].value,
        eventId = this[Reservations.eventId].value,
        userId = this[Reservations.userId]?.value,
        status = this[Reservations.status],
        participantName = this[Reservations.participantName],
        participantEmail = this[Reservations.participantEmail],
        participantPhone = this[Reservations.participantPhone],
        notes = this[Reservations.notes],
        createdAt = this[Reservations.createdAt],
        updatedAt = this[Reservations.updatedAt]
    )

    suspend fun create(
        eventId: Long,
        userId: Long?,
        participantName: String,
        participantEmail: String,
        participantPhone: String?,
        notes: String
    ): Reservation {
        val id = Reservations.insert {
            it[Reservations.eventId] = EntityID(eventId, Events)
            it[Reservations.userId] = userId?.let { uid -> EntityID(uid, Users) }
            it[Reservations.participantName] = participantName
            it[Reservations.participantEmail] = participantEmail
            it[Reservations.participantPhone] = participantPhone
            it[Reservations.notes] = notes.ifBlank { null }
        }[Reservations.id].value

        return findById(id)!!
    }

    suspend fun findById(id: Long): Reservation? {
        return Reservations.select { Reservations.id eq id }
            .map { it.toReservation() }
            .singleOrNull()
    }

    suspend fun findByEventId(eventId: Long): List<Reservation> {
        return Reservations.select { Reservations.eventId eq eventId }
            .orderBy(Reservations.createdAt, SortOrder.DESC)
            .map { it.toReservation() }
    }

    suspend fun findByUserId(userId: Long): List<Reservation> {
        return Reservations.select { Reservations.userId eq userId }
            .orderBy(Reservations.createdAt, SortOrder.DESC)
            .map { it.toReservation() }
    }

    suspend fun findByEmail(email: String): List<Reservation> {
        return Reservations.select { Reservations.participantEmail eq email }
            .orderBy(Reservations.createdAt, SortOrder.DESC)
            .map { it.toReservation() }
    }

    suspend fun updateStatus(id: Long, status: String): Boolean {
        val updated = Reservations.update({ Reservations.id eq id }) {
            it[Reservations.status] = status
            it[Reservations.updatedAt] = LocalDateTime.now()
        }
        return updated > 0
    }

    suspend fun countByEventId(eventId: Long, status: String = "confirmed"): Long {
        return Reservations.select {
            (Reservations.eventId eq eventId) and (Reservations.status eq status)
        }.count()
    }

    suspend fun delete(id: Long): Boolean {
        val deleted = Reservations.deleteWhere { Reservations.id eq id }
        return deleted > 0
    }
}
