use std::env;
extern crate napi_build;

fn main() {
  // https://github.com/sfackler/rust-openssl/issues/1526#issuecomment-926844330
  // Set env variable to not link openssl so that the node version is used
  env::set_var("OPENSSL_LIBS", "");

  // Tell cargo to allow undefined dynamic links for openssl
  println!("cargo:rustc-cdylib-link-arg=-undefined");
  println!("cargo:rustc-cdylib-link-arg=dynamic_lookup");

  napi_build::setup();
}
