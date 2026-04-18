package com.hajj.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class RuntimeStoreTest {

    private RuntimeStore store;

    @BeforeEach
    void setUp() {
        store = new RuntimeStore();
    }

    @Test
    void set_and_get_returns_stored_value() {
        store.set("key", "value");
        assertThat(store.get("key")).contains("value");
    }

    @Test
    void get_missing_key_returns_empty_optional() {
        assertThat(store.get("does-not-exist")).isEmpty();
    }

    @Test
    void set_overwrites_existing_value() {
        store.set("key", "first");
        store.set("key", "second");
        assertThat(store.get("key")).contains("second");
    }

    @Test
    void delete_existing_key_returns_true_and_removes_it() {
        store.set("key", "value");
        assertThat(store.delete("key")).isTrue();
        assertThat(store.get("key")).isEmpty();
    }

    @Test
    void delete_missing_key_returns_false() {
        assertThat(store.delete("does-not-exist")).isFalse();
    }

    @Test
    void getAll_returns_all_stored_pairs() {
        store.set("a", "1");
        store.set("b", "2");
        assertThat(store.getAll())
                .containsEntry("a", "1")
                .containsEntry("b", "2")
                .hasSize(2);
    }

    @Test
    void getAll_returns_unmodifiable_map() {
        store.set("a", "1");
        var snapshot = store.getAll();
        assertThatThrownBy(() -> snapshot.put("x", "y"))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
